# WPScan GitHib action

A GitHub action that can be used to run vulnerability checks using WPScan, typical use case would be against sites for periodic maintenance checks.

## Inputs

### `url`
Target WordPress URL to scan

### `token`
API token for wpscan.com

### `options`
Additional options for `wpscan`. Defaults are `--no-banner --disable-tls-checks --random-user-agent`

## Example usage

```yaml
uses: mcarrowsmith/action-wpscan@{branch/tag}
with:
    url: ${{ secrets.URL }}
    token: ${{ secrets.WPSCAN_TOKEN }}
```

## Testing/Development
Create the following to Environment variables to help with mocking GitHub Core.

- `GITHUB_STEP_SUMMARY`, the value should be an absolute path to a Markdown file.
- `INPUT_JSON`, JSON body of WPScan JSON output format. See assets directory.

