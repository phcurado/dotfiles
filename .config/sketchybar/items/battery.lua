local icons = require("icons")
local colors = require("colors")
local settings = require("settings")

local battery = sbar.add("item", "battery", {
	position = "right",
	icon = { font = { family = settings.font.text, style = settings.font.style_map["Regular"], size = 19.0 } },
	label = { drawing = false },
	update_freq = 120,
	padding_right = 12,
})

local function update()
	sbar.exec("pmset -g batt", function(batt)
		local charge = tonumber(batt:match("(%d+)%%"))
		if not charge then
			return
		end
		local charging = batt:find("AC Power") ~= nil

		local icon, color
		if charging then
			icon = icons.battery.charging
			color = colors.green
		elseif charge > 80 then
			icon = icons.battery._100
			color = colors.white
		elseif charge > 60 then
			icon = icons.battery._75
			color = colors.white
		elseif charge > 40 then
			icon = icons.battery._50
			color = colors.white
		elseif charge > 20 then
			icon = icons.battery._25
			color = colors.orange
		else
			icon = icons.battery._0
			color = colors.red
		end

		battery:set({ icon = { string = icon, color = color } })
	end)
end

battery:subscribe({ "routine", "power_source_change", "system_woke" }, update)
update()
