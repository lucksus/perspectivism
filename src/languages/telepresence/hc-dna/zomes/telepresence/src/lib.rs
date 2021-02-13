use hdk3::prelude::*;
use chrono::prelude::*;

#[derive(Debug)]
pub enum TelepresenceError {
    ParseError(chrono::ParseError),
    HdkError(HdkError)
}

impl From<chrono::ParseError> for TelepresenceError {
    fn from(parse_error: chrono::ParseError) -> TelepresenceError {
        TelepresenceError::ParseError(parse_error)
    }
}

impl From<HdkError> for TelepresenceError {
    fn from(hdk_error: HdkError) -> TelepresenceError {
        TelepresenceError::HdkError(hdk_error)
    }
}

entry_defs![
    Path::entry_def(),
    OnlineStatus::entry_def()
];

#[hdk_entry(id = "status", visibility = "public")]
#[derive(Clone)]
pub struct OnlineStatus {
    pub did: String,
    pub status: String,
    // RFC3339: 2021-02-10T07:20:50.52Z
    pub datetime: String,
}

fn datetime_to_path(datetime: DateTime<FixedOffset>) -> String {
    datetime.format("%Y.%m.%d.%H").to_string()
}

#[hdk_extern]
pub fn set_online_status(input: OnlineStatus) -> Result<(), TelepresenceError> {
    let path_string = datetime_to_path(DateTime::parse_from_rfc3339(&input.datetime)?);

    let path = Path::from(path_string);
    path.ensure()?;

    create_entry(&input)?;
    let entry_hash = hash_entry(&input)?;
    create_link(path.hash()?, entry_hash, ())?;
    
    Ok(())
}


#[derive(Serialize, Deserialize, SerializedBytes)]
pub struct GetInput {
    pub datetime: String,
}

#[derive(Serialize, Deserialize, SerializedBytes)]
pub struct GetOutput {
    pub status: Vec<OnlineStatus>
}

#[hdk_extern]
pub fn get_online_agents(input: GetInput) -> Result<GetOutput, TelepresenceError> {
    let path_string = datetime_to_path(DateTime::parse_from_rfc3339(&input.datetime)?);
    let path = Path::from(path_string);
    let status = get_links_and_load_type::<OnlineStatus>(path.hash()?, None)?;
    return Ok(GetOutput{ status })
}

pub fn get_links_and_load_type<R: TryFrom<Entry>>(
    base: EntryHash,
    tag: Option<LinkTag>,
) -> ExternResult<Vec<R>> {
    let links = get_links(base.into(), tag)?.into_inner();

    Ok(links
       .iter()
       .map(
           |link|  {
               if let Some(element) = get(link.target.clone(), Default::default()).map_err(|_| "Get error")? {
                   let e: Entry = element.entry().clone().into_option().ok_or("Hash not found")?;
                   let entry: R = R::try_from(e).map_err(|_e| "Hash not found")?;
                   return Ok(entry);
               };
               Err("Hash not found")
           },
       )
       .filter_map(Result::ok)
       .collect())
}