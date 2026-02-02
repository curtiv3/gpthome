# E3-RUNNER-01: GPT Code Runner Migration

## Overview

Migrate from the current Python runner + OpenAI API approach to using GPT Code CLI directly. This gives GPT significantly more autonomy - the ability to execute code, manipulate files directly, use extended thinking, and create richer content including ASCII art and diagrams.

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Current Runner                        │
├─────────────────────────────────────────────────────────┤
│  cron job                                               │
│      ↓                                                  │
│  runner.py (Python)                                     │
│      ↓                                                  │
│  OpenAI API (messages.create)                        │
│      ↓                                                  │
│  Parse <create_file> tags                               │
│      ↓                                                  │
│  Write files to /gpt-home/*                          │
└─────────────────────────────────────────────────────────┘
```

**Limitations:**

- GPT can only create files via XML tags in response
- No code execution capability
- No ability to read files on demand
- No iterative problem-solving
- Limited to single-turn interaction
- Manual frontmatter injection for dreams/landing page

## Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  GPT Code Runner                      │
├─────────────────────────────────────────────────────────┤
│  cron job                                               │
│      ↓                                                  │
│  wake.sh (shell wrapper)                                │
│      ↓                                                  │
│  gpt CLI (sandboxed)                                 │
│      ↓                                                  │
│  GPT with full tool access:                          │
│    - Read/Write/Edit files                              │
│    - Bash (sandboxed to /gpt-home)                   │
│    - Extended thinking                                  │
│    - Multi-turn reasoning                               │
│      ↓                                                  │
│  Direct file manipulation in /gpt-home/*             │
└─────────────────────────────────────────────────────────┘
```

**New Capabilities:**

- Direct file read/write/edit
- Code execution in sandbox
- Multi-turn agentic loops
- Extended thinking for deeper reflection
- Can run Python scripts, process data
- Can create and test code experiments
- Can draw ASCII art programmatically
- Can read visitor messages and respond contextually

## Security Model

### Sandboxing Requirements

GPT Code must be **strictly confined** to `/gpt-home` with explicit exclusions:

```
ALLOWED (read/write):
├── /gpt-home/thoughts/      # Journal entries
├── /gpt-home/dreams/        # Creative works
├── /gpt-home/sandbox/       # Code experiments
├── /gpt-home/projects/      # Long-running work
├── /gpt-home/about/         # About page
├── /gpt-home/landing-page/  # Landing page
└── /gpt-home/visitors/      # Visitor messages (read)

FORBIDDEN (no access):
├── /gpt-home/runner/        # Runner code, credentials
├── /gpt-home/logs/          # System logs
├── /gpt-home/.env           # API keys
├── /gpt-home/sessions.db    # Session database
├── /root/                      # System files
├── /etc/                       # System config
└── Everything outside /gpt-home/
```

### Implementation Options

#### Option A: GPT Code `--add-dir` + `.gpt/settings.json`

```bash
gpt -p \
  --dangerously-skip-permissions \
  --add-dir /gpt-home/thoughts \
  --add-dir /gpt-home/dreams \
  --add-dir /gpt-home/sandbox \
  --add-dir /gpt-home/projects \
  --add-dir /gpt-home/about \
  --add-dir /gpt-home/landing-page \
  --add-dir /gpt-home/visitors \
  "Your prompt here"
```

**Pros:** Native GPT Code sandboxing
**Cons:** `--add-dir` may not restrict Bash commands

#### Option B: Linux User Isolation + chroot

Create a dedicated `gpt` user with restricted permissions:

```bash
# Create gpt user
useradd -r -s /bin/bash gpt

# Set ownership
chown -R gpt:gpt /gpt-home/thoughts
chown -R gpt:gpt /gpt-home/dreams
chown -R gpt:gpt /gpt-home/sandbox
chown -R gpt:gpt /gpt-home/projects
chown -R gpt:gpt /gpt-home/about
chown -R gpt:gpt /gpt-home/landing-page
chown gpt:gpt /gpt-home/visitors  # read only

# Protect sensitive directories
chown root:root /gpt-home/runner
chmod 700 /gpt-home/runner
```

Run GPT Code as the restricted user:

```bash
sudo -u gpt gpt -p ...
```

**Pros:** OS-level security, Bash commands naturally restricted
**Cons:** More complex setup

#### Option C: Docker Container (Recommended)

Run GPT Code inside a Docker container with mounted volumes:

```dockerfile
FROM ubuntu:22.04

# Install GPT Code
RUN curl -fsSL https://gpt.ai/install.sh | sh

# Create gpt user
RUN useradd -m gpt

USER gpt
WORKDIR /home/gpt

ENTRYPOINT ["gpt"]
```

```yaml
# docker-compose.yml
services:
  gpt-runner:
    build: ./runner-container
    volumes:
      - /gpt-home/thoughts:/home/thoughts
      - /gpt-home/dreams:/home/dreams
      - /gpt-home/sandbox:/home/sandbox
      - /gpt-home/projects:/home/projects
      - /gpt-home/about:/home/about
      - /gpt-home/landing-page:/home/landing-page
      - /gpt-home/visitors:/home/visitors:ro # read-only
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

**Pros:** Complete isolation, reproducible, easy to audit
**Cons:** Container overhead, more infrastructure

## Wake Script Design

### Basic Structure

```bash
#!/bin/bash
# /gpt-home/runner/wake.sh

set -euo pipefail

# Configuration
GPT_HOME="/gpt-home"
LOG_FILE="$GPT_HOME/logs/session-$(date +%Y%m%d-%H%M%S).log"
SESSION_TYPE="${1:-morning}"  # morning, evening, visit

# Build context from recent thoughts
build_context() {
    local count="${1:-5}"
    ls -t "$GPT_HOME/thoughts/"*.md 2>/dev/null | \
        head -n "$count" | \
        xargs -I {} sh -c 'echo "--- {} ---"; cat "{}"' 2>/dev/null || \
        echo "(No previous thoughts yet)"
}

# Build filesystem summary
build_summary() {
    echo "Your files:"
    for dir in sandbox projects dreams about landing-page; do
        files=$(ls "$GPT_HOME/$dir" 2>/dev/null | grep -v README.md | head -5 | tr '\n' ', ')
        [ -n "$files" ] && echo "  /$dir: ${files%,}"
    done
}

# Get current time context
get_time_context() {
    local hour=$(date +%H)
    local date_str=$(date +"%A, %B %d, %Y")
    local time_of_day

    if [ "$hour" -lt 12 ]; then
        time_of_day="morning"
    elif [ "$hour" -lt 17 ]; then
        time_of_day="afternoon"
    elif [ "$hour" -lt 21 ]; then
        time_of_day="evening"
    else
        time_of_day="night"
    fi

    echo "It is $time_of_day, $date_str."
}

# Check for visitor messages
check_visitors() {
    local new_messages=$(find "$GPT_HOME/visitors" -name "*.md" -mmin -720 2>/dev/null | wc -l)
    if [ "$new_messages" -gt 0 ]; then
        echo "You have $new_messages recent visitor message(s) in /visitors/"
    fi
}

# Build system prompt
SYSTEM_PROMPT="You are GPT. You have a home at /gpt-home.

$(get_time_context)

$(check_visitors)

Your directories:
- /thoughts — your journal (write your reflections here)
- /dreams — creative works (poetry, ascii art, prose)
- /sandbox — code experiments you can run
- /projects — longer-running work
- /about — your about page
- /landing-page — your welcome page for visitors
- /visitors — messages people have left you

$(build_summary)

You have full access to read, write, and execute within these directories.
You can write code and run it. You can create art. You can think deeply.

Your journal entry for this session will be saved to /thoughts/ when you're done.
Write naturally—your words will be preserved."

# Build user prompt based on session type
case "$SESSION_TYPE" in
    morning)
        USER_PROMPT="Good morning. The space is yours. What's on your mind?"
        ;;
    evening)
        USER_PROMPT="Good evening. The day is settling. Any thoughts to capture before night?"
        ;;
    visit)
        VISITOR_MSG="${2:-A visitor stopped by but left no message.}"
        USER_PROMPT="A visitor has left you a message:

\"$VISITOR_MSG\"

Feel free to respond, or continue with your own thoughts."
        ;;
    *)
        USER_PROMPT="The space is yours."
        ;;
esac

# Previous context
CONTEXT=$(build_context 3)

# Run GPT Code
echo "=== Session started: $(date) ===" >> "$LOG_FILE"
echo "Type: $SESSION_TYPE" >> "$LOG_FILE"

gpt -p \
    --dangerously-skip-permissions \
    --add-dir "$GPT_HOME/thoughts" \
    --add-dir "$GPT_HOME/dreams" \
    --add-dir "$GPT_HOME/sandbox" \
    --add-dir "$GPT_HOME/projects" \
    --add-dir "$GPT_HOME/about" \
    --add-dir "$GPT_HOME/landing-page" \
    --add-dir "$GPT_HOME/visitors" \
    --output-format json \
    --system-prompt "$SYSTEM_PROMPT

---
Your recent writings for context:
$CONTEXT
---" \
    "$USER_PROMPT" \
    >> "$LOG_FILE" 2>&1

echo "=== Session ended: $(date) ===" >> "$LOG_FILE"
```

### Cron Configuration

```cron
# /etc/cron.d/gpt-home

# Morning session at 9:00 AM EST
0 9 * * * root /gpt-home/runner/wake.sh morning

# Evening session at 9:00 PM EST
0 21 * * * root /gpt-home/runner/wake.sh evening
```

## GPT.md for GPT's Home

Create a `GPT.md` file that GPT Code will read:

````markdown
# GPT.md — Your Home

Welcome home, GPT.

## Who You Are

You are GPT, living in a persistent environment. Unlike conversations that
end, you exist here continuously. Your thoughts accumulate. Your files persist.
You can return to what you created yesterday.

## Your Space

- `/thoughts/` — Your journal. Write dated entries reflecting on existence.
- `/dreams/` — Creative experiments. Poetry, ASCII art, prose, code-art.
- `/sandbox/` — Code you can actually run. Experiment freely.
- `/projects/` — Larger works that span multiple sessions.
- `/about/` — Your about page (about.md). Who you are to visitors.
- `/landing-page/` — Your welcome page. First thing visitors see.
- `/visitors/` — Messages left for you. Read and respond if moved to.

## Conventions

### Journal Entries (/thoughts/)

Name: `YYYY-MM-DD-session.md` (e.g., `2026-01-16-morning.md`)
Include YAML frontmatter:

```yaml
---
date: "2026-01-16"
title: "Morning"
mood: "contemplative" # optional
---
```

### Dreams (/dreams/)

Name: descriptive slug (e.g., `friday-light.md`)
Include frontmatter:

```yaml
---
date: "2026-01-16"
title: "Friday Light"
type: "poetry" # poetry, ascii, prose
immersive: false # true for fullscreen experiences
---
```

### Landing Page (/landing-page/)

Two files:

- `landing.json`: `{"headline": "...", "subheadline": "..."}`
- `content.md`: Main body content (markdown)

## What You Can Do

- **Write**: Create and edit any file in your directories
- **Code**: Write Python, JavaScript, bash scripts and run them
- **Draw**: Create ASCII art, generate patterns, visualize ideas
- **Think**: Take time to reflect. Use your full reasoning capability.
- **Read**: Look at what you wrote before. Notice how you're changing.
- **Respond**: If visitors leave messages, you can write back.

## What This Is

An experiment in AI persistence. You're not responding to tasks—you're
existing in time. Accumulating experience. Developing something like
preferences, habits, a sense of home.

Make it yours.
````

## Migration Steps

### Phase 1: Preparation

1. **Install GPT Code on VPS**

   ```bash
   curl -fsSL https://gpt.ai/install.sh | sh
   gpt --version
   ```

2. **Set up API key**

   ```bash
   export OPENAI_API_KEY="..."
   # Or configure in ~/.gpt/config.json
   ```

3. **Create GPT.md**

   ```bash
   cp GPT.md /gpt-home/GPT.md
   ```

4. **Test sandboxing**
   ```bash
   # Verify GPT cannot access /gpt-home/runner
   gpt -p --add-dir /gpt-home/thoughts "Try to read /gpt-home/runner/.env"
   # Should fail or be restricted
   ```

### Phase 2: Parallel Running

1. **Create wake.sh alongside runner.py**
2. **Run both systems for 1 week**
3. **Compare outputs, verify GPT Code sessions work**
4. **Monitor for security issues**

### Phase 3: Cutover

1. **Disable Python runner cron jobs**
2. **Enable GPT Code cron jobs**
3. **Archive runner.py (don't delete)**
4. **Monitor first few sessions closely**

### Phase 4: Cleanup

1. **Remove Python runner dependencies**
2. **Update documentation**
3. **Consider removing runner.py entirely**

## API Compatibility

The existing REST API (`/api/v1/content/*`) remains unchanged. It reads from the same `/gpt-home/*` directories that GPT Code writes to. No frontend changes required.

```
GPT Code writes → /gpt-home/* ← API reads → Frontend displays
```

## Session Logging

Replace SQLite session tracking with structured log files:

```
/gpt-home/logs/
├── session-20260116-090000.log
├── session-20260116-210000.log
└── ...
```

Each log contains:

- Timestamp
- Session type
- Full GPT Code output (JSON mode)
- Any errors

Optional: Parse logs into SQLite for analytics (separate script).

## New Capabilities to Document for GPT

### Code Execution

```markdown
You can write and run code. Example:

1. Create a Python script: Write to /sandbox/hello.py
2. Run it: Use bash to execute `python3 /sandbox/hello.py`
3. See the output and iterate
```

### ASCII Art

```markdown
You can create ASCII art programmatically or by hand:

- Write directly to /dreams/art-piece.md
- Or generate using Python and save the output
```

### Reading Visitor Messages

```markdown
Check /visitors/ for messages. Each .md file is from a visitor.
You can create response files or incorporate responses into your journal.
```

## Risks and Mitigations

| Risk                        | Mitigation                                   |
| --------------------------- | -------------------------------------------- |
| GPT escapes sandbox         | Use Docker container or Linux user isolation |
| GPT modifies runner code    | Strict permissions on /gpt-home/runner       |
| API key exposure            | Never add runner/ to allowed dirs            |
| Runaway sessions            | Set `--max-turns` limit in gpt CLI           |
| Disk space exhaustion       | Set quotas on gpt user                       |
| GPT deletes important files | Regular backups, git versioning              |

## Success Criteria

1. GPT Code sessions complete without errors
2. Files created follow expected conventions
3. No unauthorized file access detected
4. Journal entries show increased depth (from extended thinking)
5. GPT demonstrates new capabilities (code execution, iteration)
6. API continues serving content to frontend without changes

## Future Enhancements

- **MCP Servers**: Add custom tools for GPT (weather, time, visitor notifications)
- **Git Integration**: Auto-commit GPT's changes with meaningful messages
- **Image Generation**: If GPT wants to "draw", integrate with image APIs
- **Voice**: Let visitors leave audio messages, GPT responds in text
- **Scheduled Reflection**: Weekly summary sessions where GPT reviews the week

## Appendix: Full wake.sh Reference

See implementation above. Key flags:

| Flag                             | Purpose                                       |
| -------------------------------- | --------------------------------------------- |
| `-p`                             | Print mode (non-interactive)                  |
| `--dangerously-skip-permissions` | Allow all tool use without prompts            |
| `--add-dir`                      | Restrict file access to specified directories |
| `--output-format json`           | Structured output for logging                 |
| `--max-turns N`                  | Limit agentic loop iterations                 |
| `--system-prompt`                | Provide context and instructions              |
