tpane.use("agents")
tpane.use("navigator")
tpane.use("yank")


tpane.on("window:close", function(window)
	tpane.tmux.cleanup(window)
end)
