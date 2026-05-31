local colors = require("colors")
local settings = require("settings")

local cal = sbar.add("item", "calendar", {
  position = "right",
  icon = {
    color = colors.white,
    padding_right = 8,
    font = { family = settings.font.text, style = settings.font.style_map["Black"], size = 12.0 },
  },
  label = {
    color = colors.white,
    width = 49,
    align = "right",
    font = { family = settings.font.numbers },
  },
  padding_left = 15,
  update_freq = 30,
  click_script = "open -a 'Calendar'",
})

cal:subscribe({ "forced", "routine", "system_woke" }, function()
  cal:set({ icon = os.date("%a %d %b"), label = os.date("%H:%M") })
end)
