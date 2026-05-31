local colors = require("colors")
local icons = require("icons")
local settings = require("settings")

local popup_off = "sketchybar --set apple.logo popup.drawing=off"

sbar.add("item", "apple.logo", {
  icon = {
    string = icons.apple,
    font = { family = settings.font.text, style = settings.font.style_map["Black"], size = 16.0 },
    color = colors.green,
    padding_left = 6,
    padding_right = 15,
  },
  label = { drawing = false },
  click_script = "sketchybar --set $NAME popup.drawing=toggle",
})

sbar.add("item", "apple.prefs", {
  position = "popup.apple.logo",
  icon = icons.preferences,
  label = { string = "Preferences", align = "left" },
  click_script = "open -a 'System Settings'; " .. popup_off,
})

sbar.add("item", "apple.activity", {
  position = "popup.apple.logo",
  icon = icons.activity,
  label = { string = "Activity", align = "left" },
  click_script = "open -a 'Activity Monitor'; " .. popup_off,
})

sbar.add("item", "apple.lock", {
  position = "popup.apple.logo",
  icon = icons.lock,
  label = { string = "Lock Screen", align = "left" },
  click_script = "pmset displaysleepnow; " .. popup_off,
})
