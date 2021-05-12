add_symlink() {
	ln -s ~/.dotfiles/.zshrc ~/.zshrc
	ln -s ~/.dotfiles/.gitconfig ~/.gitconfig
	ln -s ~/.dotfiles/.vimrc ~/.vimrc
}

install_oh_my_zsh() {
	sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
	git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
	git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
}

install_asdf() {
    git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.8.0
}

brew_bundle() {
	brew bundle --file ~/.dotfiles/Brewfile
}

run() {
	brew_bundle
    add_symlink
    install_asdf
	install_oh_my_zsh
}

run

