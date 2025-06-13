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

source ~/.config/zsh/.antigen/antigen.zsh

# Plugins
antigen bundle zsh-users/zsh-syntax-highlighting
antigen bundle zsh-users/zsh-autosuggestions
antigen bundle zsh-users/zsh-completions
antigen apply

# Configurations

eval "$(zoxide init zsh)"
eval "$(/usr/bin/mise activate zsh)"

export FLYCTL_INSTALL="$HOME/.fly"
export CHROME_EXECUTABLE="brave"

# Paths
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Editor and aliases
export EDITOR=nvim

alias tmux="tmux -2"
alias ls="eza --icons=always"
alias cat="bat"
alias n="nvim"

# Keys
bindkey "^[[1;5C" forward-word
bindkey "^[[1;5D" backward-word

# Enable vi mode
bindkey -v

source <(fzf --zsh)

eval "$(starship init zsh)"
