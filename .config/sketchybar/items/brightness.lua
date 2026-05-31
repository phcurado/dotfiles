local icons = require("icons")
local colors = require("colors")
local settings = require("settings")

local brightness = sbar.add("item", "brightness", {
  position = "right",
  icon = {
    string = icons.brightness,
    color = colors.yellow,
    font = { family = settings.font.text, style = settings.font.style_map["Regular"], size = 15.0 },
    padding_left = 4,
    padding_right = 4,
  },
  label = { drawing = false },
  click_script = "open 'x-apple.systempreferences:com.apple.Displays-Settings.extension'",
})

-- Scroll the icon to step brightness (uses the F14/F15 brightness key codes)
brightness:subscribe("mouse.scrolled", function(env)
  local up = (env.SCROLL_DELTA or 0) > 0
  local key = up and 144 or 145
  sbar.exec("osascript -e 'tell application \"System Events\" to key code " .. key .. "'")
end)
