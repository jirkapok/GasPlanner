# Use with AI

Your AI assistant (e.g. Claude) can plan dives with the same calculation as this application. Ask it in your own words, e.g. "Plan a 30 m dive for 20 minutes on air with a 15 l tank filled to 200 bar", and it calls the Dugong planner instead of guessing the numbers.

> None of the authors, contributors, administrators, or anyone else connected with this project can be responsible for your use of the information provided by this application or linked from these web pages. Use the results at your own risk.

The AI shows this disclaimer with every plan. Always verify the plan before the dive, the same way as plans from this application.

## What it can do

This version plans a single level open circuit dive: depth, bottom time, the bottom gas tank and optional decompression gas tanks. The result contains the runtime, decompression stops, the no decompression limit, gas consumption and reserve per tank, oxygen toxicity (CNS, OTU), the maximum gas density and warnings. The options (gradient factors, salinity, altitude, speeds, safety stop, ...) and the defaults are the same as for a new dive in this application. All values are in metric units.

Not supported yet: multilevel dives, repetitive dives, rebreathers and the calculators.

There are two ways to connect it, both run on your computer and don't send your dives anywhere else than to your AI:

* **MCP server** for AI applications supporting the Model Context Protocol (Claude Desktop, Claude Code and others): [Download dugong.mcpb](/ai/dugong.mcpb)
* **Skill** for Claude (claude.ai with code execution or Claude Code): [Download dugong-skill.zip](/ai/dugong-skill.zip)

## Claude Desktop

1. Download [dugong.mcpb](/ai/dugong.mcpb).
2. Double-click the file, or open Claude Desktop `Settings > Extensions > Advanced settings > Install Extension` and select the file.
3. Confirm the installation, the extension `Dugong Gas Planner` is enabled.
4. Start a new chat and ask for a dive plan.

To update, download the new file and install it again.

## Claude Code and other MCP clients

Requires [Node.js](https://nodejs.org) 20 or newer.

1. Download [dugong.mcpb](/ai/dugong.mcpb), it is a zip archive with a different extension. Extract it to a new folder `dugong`:
   * Windows (PowerShell or Command Prompt) and macOS: `mkdir dugong` and `tar -xf dugong.mcpb -C dugong`
   * Linux: `unzip dugong.mcpb -d dugong`
2. In Claude Code run `claude mcp add dugong -- node <full path>/dugong/server/dugong-mcp.mjs` with the full path to the folder, e.g. `C:\Users\diver\dugong\server\dugong-mcp.mjs` on Windows or `/home/diver/dugong/server/dugong-mcp.mjs` on Linux (don't use `~`, the path is passed as it is). Check the server is connected using `/mcp`.

Other MCP clients use the same command in their configuration, usually:

```json
{
  "mcpServers": {
    "dugong": {
      "command": "node",
      "args": ["/path/to/dugong/server/dugong-mcp.mjs"]
    }
  }
}
```

## Skill

The Skill teaches Claude to run the bundled planner command, requires code execution with Node.js.

* claude.ai: download [dugong-skill.zip](/ai/dugong-skill.zip), open `Settings > Capabilities > Skills`, upload the file and enable it. Code execution has to be enabled.
* Claude Code: download [dugong-skill.zip](/ai/dugong-skill.zip) and unzip it into `~/.claude/skills/`, so the instructions are in `~/.claude/skills/dugong-dive-planner/SKILL.md`. Start a new session.

## Example prompts

* "Plan a 30 m dive for 20 minutes on air with a 15 l tank filled to 200 bar."
* "Plan a 45 m dive for 25 minutes on trimix 21/35 in a 24 l tank at 200 bar, with an 11 l tank of EAN50 for deco."
* "Is a 12 l tank with 200 bar enough for 25 minutes at 25 m with RMV 18 l/min in salt water?"
* "What are the deco stops for 40 m and 30 minutes on EAN28 with gradient factors 30/70?"
