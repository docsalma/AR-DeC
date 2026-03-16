#!/bin/bash
# notify.sh - Play notification sound when Claude needs user attention
# Works on Windows (Git Bash/MSYS2), macOS, and Linux

play_sound() {
  if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
    # Windows - use PowerShell to play system notification sound
    powershell.exe -NoProfile -NonInteractive -Command "
      Add-Type -AssemblyName System.Media
      \$player = New-Object System.Media.SoundPlayer 'C:\\Windows\\Media\\notify.wav'
      \$player.PlaySync()
    " 2>/dev/null || powershell.exe -NoProfile -Command "[console]::beep(800,300); [console]::beep(1000,200)" 2>/dev/null
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null \
      || aplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null \
      || printf '\a' # terminal bell fallback
  else
    printf '\a' # universal fallback - terminal bell
  fi
}

play_sound &
exit 0
