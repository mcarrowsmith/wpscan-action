import core from '@actions/core'

const loadJson = () => {
    try {
        core.debug('Attempting to load JSON from env')
        return JSON.parse(core.getInput('json'))
    } catch (err) {
        core.setFailed(`JSON output: ${err.message}`)
        process.exit(1)
    }
}

const mapVulnerabilities = output => {
    let wordpressCore = output.version || {}
    let wordpressVulnerabilities = wordpressCore.vulnerabilities || []
    let plugins = output.plugins || []
    let vulnerabilities = []

    vulnerabilities.push(
        ...wordpressVulnerabilities.map(vuln => {
            vuln.version = wordpressCore.number
            vuln.status = wordpressCore.status
            vuln.confidence = wordpressCore.confidence

            return vuln
        })
    )

    Object.keys(plugins).forEach(key => {
        let plugin = plugins[key]
        let pluginVulnerability = plugin['vulnerabilities'] ?? []

        if (pluginVulnerability.length > 0) {
            vulnerabilities.push(
                ...pluginVulnerability.map(vuln => {
                    vuln.version = plugin?.version?.number || null
                    vuln.confidence = plugin?.version?.confidence || null
                    vuln.latest_version = plugin.latest_version

                    return vuln
                })
            )
        }
    })

    return vulnerabilities
}

async function sendToActionSummary(vulnerabilities) {
    for (const vuln of vulnerabilities) {
        const fixedIn = vuln.fixed_in !== null ? `${vuln.fixed_in} ✅` : '❌'
        const version = vuln.version || '❓'

        let content = core.summary
            .addRaw(`### ${vuln.title}`, true)
            .addTable([
                [
                    { data: 'Version', header: true },
                    { data: 'Fixed Version', header: true }
                ],
                [version, fixedIn]
            ])
            .addEOL()

        const links = vuln?.references?.url || []

        if (links.length > 0) {
            content = content
                .addRaw('**Links**', true)
                .addRaw(
                    links
                        .map(link => {
                            return `* [${link}](${link})`
                        })
                        .join('\n')
                )
                .addEOL()
        }

        await content.write()
    }
}

void (async function main() {
    const output = loadJson()
    let wordpressCore = output.version || {}
    const targetUrl = output.target_url || null
    const scanAborted = output.scan_aborted || false

    if (scanAborted !== false) {
        await core.summary.addRaw(`:exclamation: Scan aborted - ${scanAborted}`).write()
        core.setFailed(`WPScan - ${scanAborted}`)
        process.exit(1)
    }

    const vulnerabilities = mapVulnerabilities(output)

    core.debug(`Vulnerabilities found: ${vulnerabilities.length}`)

    if (vulnerabilities.length === 0) {
        await core.summary.addRaw(':green_heart: No vulnerabilities found').write()
        process.exit(0)
    }

    await sendToActionSummary(vulnerabilities)
})()
