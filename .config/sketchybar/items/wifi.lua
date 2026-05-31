local icons = require("icons")
local colors = require("colors")
local settings = require("settings")

local wifi = sbar.add("item", "wifi", {
  position = "right",
  icon = {
    string = icons.wifi.connected,
    font = { family = settings.font.text, style = settings.font.style_map["Regular"], size = 14.0 },
    padding_left = 8,
    padding_right = 4,
  },
  label = { drawing = false },
  update_freq = 10,
  click_script = "open 'x-apple.systempreferences:com.apple.wifi-settings-extension'",
})

local function update()
  sbar.exec("ipconfig getifaddr en0", function(ip)
    local connected = ip:gsub("%s+", "") ~= ""
    wifi:set({
      icon = {
        string = connected and icons.wifi.connected or icons.wifi.disconnected,
        color = connected and colors.white or colors.red,
      },
    })
  end)
end

wifi:subscribe({ "routine", "wifi_change", "system_woke", "forced" }, update)
update()
