local colors = require("colors")
local settings = require("settings")

-- Live CPU graph (blue line) + percentage, no surrounding box
local cpu_graph = sbar.add("graph", "cpu.graph", 75, {
  position = "right",
  graph = { color = colors.blue, fill_color = colors.with_alpha(colors.blue, 0.2) },
  background = { height = 22, color = colors.transparent, drawing = true },
  icon = { drawing = false },
  label = { drawing = false },
  padding_right = 12,
})

local cpu = sbar.add("item", "cpu.percent", {
  position = "right",
  icon = {
    string = "CPU",
    color = colors.blue,
    font = { family = settings.font.text, style = settings.font.style_map["Heavy"], size = 10.0 },
    padding_right = 4,
  },
  label = {
    string = "..%",
    font = { family = settings.font.numbers, style = settings.font.style_map["Heavy"], size = 12.0 },
    width = 40,
    align = "right",
  },
  padding_left = 12,
  padding_right = 8,
  update_freq = 5,
})

cpu:subscribe({ "routine", "forced" }, function()
  sbar.exec("top -l1 -n0", function(out)
    local user, system = out:match("CPU usage: ([%d.]+)%% user, ([%d.]+)%% sys")
    local pct = user and math.floor(tonumber(user) + tonumber(system)) or 0
    cpu:set({ label = pct .. "%" })
    cpu_graph:push({ pct / 100.0 })
  end)
end)
