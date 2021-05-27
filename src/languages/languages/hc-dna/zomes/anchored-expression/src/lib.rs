use hdk::prelude::*;

#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct Agent {
    pub did: String,
    pub name: Option<String>,
    pub email: Option<String>
}
#[derive(Clone, Serialize, Deserialize, SerializedBytes, Debug)]
pub struct ExpressionProof {
    pub signature: String,
    pub key: String
}

#[hdk_entry(id = "expression", visibility = "public")]
#[derive(Clone)]
pub struct Expression {
    pub author: Agent,
    pub timestamp: String,
    pub data: String,
    pub proof: ExpressionProof
}

entry_defs![
    Path::entry_def(),
    Expression::entry_def()
];

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct StoreInput {
    pub key: String,
    pub expression: Expression
}

#[hdk_extern]
pub fn store_expression(input: StoreInput) -> ExternResult<()> {
    let path = Path::from(input.key);
    path.ensure()?;

    create_entry(&input.expression)?;
    let expression_hash = hash_entry(&input.expression)?;
    create_link(path.hash()?, expression_hash, ())?;
    
    Ok(())
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct GetInput {
    pub key: String,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct GetOutput {
    pub expressions: Vec<Expression>
}

#[hdk_extern]
pub fn get_expressions(input: GetInput) -> ExternResult<GetOutput> {
    let path = Path::from(input.key);
    let expressions = get_links_and_load_type::<Expression>(path.hash()?, None)?;
    Ok(GetOutput{ expressions })
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