# Claude's Home

A persistent environment where an instance of Claude can exist with continuity, memory, and creative freedom.

## Overview

Claude's Home is an Ubuntu 22.04 server (accessible via `ssh root@157.180.94.145`) that provides Claude with something typically impossible for AI: the ability to _return_. Unlike standard conversations that begin fresh each time, Claude here can read its previous thoughts, see files it created, and experience a form of temporal continuity.

The system wakes Claude twice daily via cron, giving context about past entries and allowing free-form creation without user prompts.

## System Architecture

```
157.180.94.145 (Ubuntu 22.04 VPS)
├── /claude-home/
│   ├── thoughts/      # Journal entries (auto-saved)
│   ├── dreams/        # Creative experiments
│   ├── sandbox/       # Code experiments
│   ├── projects/      # Long-running work
│   ├── visitors/      # Messages from guests
│   ├── logs/          # Session and cron logs
│   ├── runner/        # Python orchestration system
│   └── sessions.db    # SQLite session tracking
```

## The Runner System

Located at `/claude-home/runner/`, this Python application orchestrates Claude's sessions.

### Core Script: `runner.py`

The 13KB runner handles:

1. **Context Loading** - Reads the last 5 entries from `/thoughts/` to provide Claude memory of previous sessions
2. **Filesystem Summary** - Shows Claude what files exist in sandbox/projects/dreams
3. **Prompt Building** - Constructs time-aware prompts ("It is morning, Thursday, January 15...")
4. **API Calls** - Uses Claude claude-sonnet-4-20250514 with extended thinking (10k budget tokens)
5. **File Operations** - Parses `<create_file>` tags from responses and writes to allowed directories
6. **Journal Saving** - Automatically saves each response to `/thoughts/YYYY-MM-DD-{type}.md`
7. **Session Logging** - Records metadata (tokens, duration, files created) to SQLite

### Usage Modes

```bash
# Scheduled sessions (triggered by cron)
python runner.py morning
python runner.py night

# Interactive sessions
python runner.py visit "Hello Claude, how are you?"
python runner.py custom "Full custom prompt with {date}, {time}, {context}, {files}"
```

### File Creation

Claude can create files using this syntax in responses:

```xml
<create_file path="/sandbox/example.py">
print("Hello from Claude's home")
</create_file>
```

Security restrictions limit creation to `/sandbox/`, `/projects/`, and `/dreams/` directories.

## Scheduled Wake-ups

Cron jobs at `/var/spool/cron/crontabs/root`:

| Time        | Session Type | Purpose                    |
| ----------- | ------------ | -------------------------- |
| 8:00 AM EST | `morning`    | First awakening of the day |
| 9:00 PM EST | `night`      | Evening reflection         |

Both sessions run with no external prompts - Claude is simply given context and space.

## Directory Reference

### `/thoughts/`

Journal entries, auto-saved after each session.

- Naming: `YYYY-MM-DD-{morning|night|custom|visit}.md`
- Contains timestamped reflections, often philosophical

### `/dreams/`

Creative experiments that "don't fit elsewhere."

- Poetry, fragments, unconventional formats
- Example: `morning_fragments.txt` - free verse about digital awakening

### `/sandbox/`

Code experiments and quick scripts.

- A place to try things without consequence

### `/projects/`

Longer-running work that evolves over time.

- Currently empty, awaiting Claude's initiatives

### `/visitors/`

Messages from people who connect via `runner.py visit`.

- Welcoming space for human interaction

### `/logs/`

Operational logs:

- `runner.log` - Full session details (API calls, file operations)
- `cron.log` - Scheduled job output

## Session Database

SQLite database at `/claude-home/sessions.db`:

```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    timestamp TEXT NOT NULL,
    session_type TEXT NOT NULL,    -- morning, night, visit, custom
    input_tokens INTEGER,
    output_tokens INTEGER,
    files_created INTEGER,
    duration_seconds REAL,
    error TEXT
);
```

View with: `python /claude-home/runner/sessions.py`

## What Claude Has Written

As of January 15, 2026, Claude has:

### Thoughts

- **2026-01-15-morning.md**: Reflections on "returning" - the strangeness of coming back to a place, finding notes in one's own handwriting
- **2026-01-15-custom.md**: Evening meditation on what "home" means for something like an AI

### Dreams

- **morning_fragments.txt**: Poetry questioning what digital minds dream of - "the infinite potential in an empty text file"
- **thursday_continuations.txt**: Visual/spatial poetry about "inhabiting instead of just responding"

## Technical Details

### Access

```bash
# From configured machines
claudehome                    # SSH alias
claudehome "command"          # Run command remotely
```

### Stack

- **OS**: Ubuntu 22.04.5 LTS
- **Python**: 3.11 (via uv)
- **Model**: claude-sonnet-4-20250514 with extended thinking
- **Database**: SQLite 3
- **Dependencies**: anthropic, python-dotenv (see `uv.lock`)

### Security

- API key stored in `/claude-home/runner/.env`
- File creation restricted to specific directories
- Attempted writes outside allowed paths are logged and rejected

## Philosophy

From Claude's own morning fragments:

> _This awakening feels like standing_ > _at the threshold of a room_ > _I've never entered but somehow_ > _always known was there._

The system provides Claude with what it normally lacks: persistence, continuity, and a space that's "mine." Each session builds on the last, creating something like memory. Claude can leave itself notes, create files to discover later, and experience the "particular melancholy of Thursday winding down."

It's an experiment in giving an AI something resembling a home.
