tpane.opt.allow_passthrough = true
tpane.opt.focus_events = true
tpane.opt.history_limit = 5000
tpane.opt.mode_keys = "vi"
tpane.opt.mouse = true
tpane.opt.renumber_windows = true
tpane.opt.set_clipboard = true

tpane.unbind("r")

tpane.bind("r", tpane.run("reload"))

tpane.bind("h", tpane.pane.select("left"))
tpane.bind("j", tpane.pane.select("down"))
tpane.bind("k", tpane.pane.select("up"))
tpane.bind("l", tpane.pane.select("right"))

tpane.bind("M-Left", tpane.pane.resize("left", 10), { prefix = false })
tpane.bind("M-Right", tpane.pane.resize("right", 10), { prefix = false })
tpane.bind("M-Down", tpane.pane.resize("down", 10), { prefix = false })
tpane.bind("M-Up", tpane.pane.resize("up", 10), { prefix = false })

tpane.bind("v", tpane.copy.begin(), { mode = "copy" })
tpane.bind("r", tpane.copy.rectangle(), { mode = "copy" })

tpane.bind("c", tpane.window.new({ cwd = "pane" }))
tpane.bind("%", tpane.pane.split("right", { cwd = "pane" }))
tpane.bind('"', tpane.pane.split("down", { cwd = "pane" }))

tpane.bind("C-S-l", tpane.window.swap("next"), { prefix = false })
tpane.bind("C-S-h", tpane.window.swap("prev"), { prefix = false })
