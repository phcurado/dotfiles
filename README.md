# ~/dotfiles

Dotfile configuration for `archlinux`.

## Install

To setup the configuration files, it is recommended to install:

- [Neovim](https://neovim.io)
- [Wezterm](https://wezfurlong.org/wezterm)
- [Zsh](https://wiki.archlinux.org/title/Zsh)
- [Starship](https://starship.rs)
- [Stow](https://www.gnu.org/software/stow/manual/stow.html)
- [Paru](https://github.com/Morganamilo/paru)

Clone this repository in the main `$HOME` folder.

```bash
git clone git@github.com:phcurado/dotfiles.git
cd dotfiles
stow . # It might be required to delete .bashrc and/or .zshrc files, the stow cmd will notify in case of any conflicts
```
