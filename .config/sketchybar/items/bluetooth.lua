local icons = require("icons")
local colors = require("colors")
local settings = require("settings")

local bluetooth = sbar.add("item", "bluetooth", {
  position = "right",
  icon = {
    string = icons.bluetooth.on,
    font = { family = "0xProto Nerd Font", style = "Regular", size = 15.0 },
    padding_left = 4,
    padding_right = 4,
  },
  label = { drawing = false },
  update_freq = 10,
  click_script = "open 'x-apple.systempreferences:com.apple.BluetoothSettings'",
})

local function update()
  sbar.exec("blueutil --power", function(p)
    local on = p:gsub("%s+", "") == "1"
    bluetooth:set({
      icon = {
        string = on and icons.bluetooth.on or icons.bluetooth.off,
        color = on and colors.blue or colors.grey,
      },
    })
  end)
end

bluetooth:subscribe({ "routine", "bluetooth_change", "system_woke", "forced" }, update)
update()
