# Lines configured by zsh-newuser-install
HISTFILE=~/.histfile
HISTSIZE=1000
SAVEHIST=1000

LC_CTYPE=en_US.UTF-8
LC_ALL=en_US.UTF-8
LC_TIME=en_US.UTF-8

bindkey -e
# End of lines configured by zsh-newuser-install
# The following lines were added by compinstall
zstyle :compinstall filename '/home/phcurado/.zshrc'

autoload -Uz compinit
compinit
# End of lines added by compinstall

zstyle ':completion:*' menu select

source ~/.config/zsh/.antidote/antidote.zsh
antidote load

# Configurations

eval "$(zoxide init zsh)"
eval "$(/usr/bin/mise activate zsh)"

export FLYCTL_INSTALL="$HOME/.fly"
export CHROME_EXECUTABLE="brave"

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

# Keys
bindkey "^[[1;5C" forward-word
bindkey "^[[1;5D" backward-word

source <(fzf --zsh)

eval "$(starship init zsh)"
