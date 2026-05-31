local colors = require("colors")
local settings = require("settings")

local spotify = sbar.add("item", "spotify", {
  position = "center",
  drawing = false,
  update_freq = 5,
  icon = {
    string = "􁁒",
    color = colors.green,
    font = { family = settings.font.text, style = settings.font.style_map["Regular"], size = 16.0 },
    padding_right = 8,
  },
  label = {
    max_chars = 35,
    font = { family = settings.font.text, style = settings.font.style_map["Semibold"], size = 13.0 },
  },
  click_script = "open -a 'Spotify'",
})

spotify:subscribe({ "routine", "forced" }, function()
  sbar.exec([[osascript -e 'tell application "System Events" to (name of processes) contains "Spotify"']],
    function(running)
      if not running:match("true") then
        spotify:set({ drawing = false })
        return
      end
      sbar.exec(
        [[osascript -e 'tell application "Spotify" to (get name of current track) & "  —  " & (get artist of current track)' 2>/dev/null]],
        function(track)
          track = track:gsub("%s+$", "")
          if track == "" then
            spotify:set({ drawing = false })
          else
            spotify:set({ drawing = true, label = track })
          end
        end)
    end)
end)
