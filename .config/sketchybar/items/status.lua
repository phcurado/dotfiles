local colors = require("colors")

-- One rounded fieldset wrapping all the system-status controls.
-- Loaded last so every member item already exists.
sbar.add("bracket", "status.bracket", {
  "wifi",
  "bluetooth",
  "brightness",
  "volume.icon",
  "volume.slider",
  "battery",
}, {
  background = {
    color = colors.bg1,
    border_color = colors.bg2,
    border_width = 2,
    corner_radius = 9,
    height = 30,
  },
})
