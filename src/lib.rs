use deno_bindgen::deno_bindgen;
use once_cell::sync::Lazy;
use regex::Regex;

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}

const ILLEGAL_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"[/?<>\\:*|"]"#).unwrap());
const CONTROL_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"[\x00-\x1f\x80-\x9f]").unwrap());
const RESERVED_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"^\.+$").unwrap());
const WINDOWS_RESERVED_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?i)^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$").unwrap());
const WINDOWS_TRAILING_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"[\. ]+$$").unwrap());

#[deno_bindgen]
pub fn sanitize(text: &str, rep: &str) -> String {
    let text = ILLEGAL_RE.replace_all(text, rep);
    let text = CONTROL_RE.replace_all(&text, rep);
    let text = RESERVED_RE.replace(&text, rep);
    let text = WINDOWS_RESERVED_RE.replace(&text, rep);
    let text = WINDOWS_TRAILING_RE.replace(&text, rep);

    text.to_string()
}