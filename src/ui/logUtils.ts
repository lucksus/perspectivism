export function logError(result) {
    if(result.error) {
        console.error(result)
    }
    return result
}