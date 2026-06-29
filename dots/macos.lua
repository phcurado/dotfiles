dots.symlink("~/.config/aerospace", ".config/aerospace")
dots.symlink("~/.config/borders", ".config/borders")
dots.symlink("~/.config/sketchybar", ".config/sketchybar")

dots.brew.tap({ "FelixKratz/formulae" })
dots.brew.install({ "bat", "ripgrep", "sketchybar", "borders", "blueutil" })
dots.brew.cask({ "ghostty", "obsidian" })

dots.brew.service.start({ "sketchybar", "borders" })
