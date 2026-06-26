tpane.use("themes")
tpane.use("vim-navigator")
tpane.use("yank")

tpane.theme("Catppuccin Mocha", { transparent = true })

tpane.on("window:close", function(window)
	tpane.tmux.cleanup(window)
end)
