# ~/dotfiles

Dotfile configuration for `archlinux`.

<img src="images/arch.png" alt="main screen">

## Install

To setup the configuration files, it is recommended to install:

- [Neovim](https://neovim.io)
- [Wezterm](https://wezfurlong.org/wezterm)
- [Zsh](https://wiki.archlinux.org/title/Zsh)
- [Starship](https://starship.rs)
- [Stow](https://www.gnu.org/software/stow/manual/stow.html)
- [Paru](https://github.com/Morganamilo/paru)

When setting up, first clone this repository in the main `$HOME` folder.

```bash
$ cd ~/
$ git clone git@github.com:phcurado/dotfiles.git
$ cd dotfiles
```

Install the packages with:

```bash
$ paru -S - < pkgs.txt
```

or using the `Makefile`

```bash
$ make install
```

Then use the GNU `stow` to create symlinks:

```bash
$ stow .
```

Some files might conflict, `stow` will throw an error and list the files that already exists on the OS.
It's possible to override the existent files, adding the `--adopt` argument on stow:

```bash
$ stow --adopt .
```

To save the current system dependencies in the `pkgs.txt` file run:

```bash
$ paru -Qqen > pkgs.txt
```

or using the `Makefile`

```bash
$ make tofile
```
