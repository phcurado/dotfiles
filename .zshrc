# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=10000
SAVEHIST=10000
export HISTORY_IGNORE="(\&|[bf]g|c|clear|history|exit|q|pwd|* --help)"

LC_CTYPE=en_US.UTF-8
LC_ALL=en_US.UTF-8
LC_TIME=en_US.UTF-8

setopt correct
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE

bindkey -e
# End of lines configured by zsh-newuser-install
# The following lines were added by compinstall
zstyle :compinstall filename "$HOME/.zshrc"

autoload -Uz compinit
compinit
# End of lines added by compinstall

zstyle ':completion:*' menu select

source ~/.config/zsh/.antidote/antidote.zsh
antidote load

# Configurations

if [[ "$OSTYPE" == "darwin"* ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

eval "$(zoxide init zsh)"
eval "$(mise activate zsh)"

export XDG_CONFIG_HOME="$HOME/.config"

export FLYCTL_INSTALL="$HOME/.fly"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  export CHROME_EXECUTABLE="brave"
fi

# Colored man pages
export LESS_TERMCAP_md="$(tput bold 2> /dev/null; tput setaf 2 2> /dev/null)"
export LESS_TERMCAP_me="$(tput sgr0 2> /dev/null)"

# Paths
export PATH="$HOME/.local/bin:$PATH"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Editor and aliases
export EDITOR=nvim

alias tmux="tmux -2"
alias t="tmux"
alias ls="eza --icons=always"
alias cat="bat"
alias n="nvim"
# dir
alias ..="cd .."
alias ...="cd ../.."
alias c="clear"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # build
  alias make="make -j$(nproc)"
  # paru/pacman
  alias rmpkg="paru -Rsn"
  alias cleancache="paru -Scc"
  alias fixpacman="sudo rm /var/lib/pacman/db.lck"
  alias cleanup="paru -Rsn $(paru -Qtdq)"
  alias open="xdg-open"
  # system
  alias jctl="journalctl -p 3 -xb"
  alias rip="expac --timefmt='%Y-%m-%d %T' '%l\t%n %v' | sort | tail -200 | nl"
  alias tb="nc termbin.com 9999"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  alias make="make -j$(sysctl -n hw.ncpu)"
fi

# Keys
bindkey "^[[1;5C" forward-word
bindkey "^[[1;5D" backward-word

zvm_after_init_commands+=('source <(fzf --zsh)')

# pkgfile "command not found" handler (Arch Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  source /usr/share/doc/pkgfile/command-not-found.zsh
fi

eval "$(starship init zsh)"
