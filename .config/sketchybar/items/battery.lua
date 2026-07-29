local icons = require("icons")
local colors = require("colors")

local battery = sbar.add("item", "battery", {
	position = "right",
	icon = { font = { family = "0xProto Nerd Font", style = "Regular", size = 19.0 } },
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
		local plugged_in = batt:find("AC Power", 1, true) ~= nil

		local level = math.min(100, math.floor((charge + 5) / 10) * 10)
		local icon = (plugged_in and icons.battery.charging or icons.battery.levels)[level]
		local color
		if plugged_in then
			color = colors.green
		elseif charge > 40 then
			color = colors.white
		elseif charge > 20 then
			color = colors.orange
		else
			color = colors.red
		end

		battery:set({ icon = { string = icon, color = color } })
	end)
end

battery:subscribe({ "routine", "power_source_change", "system_woke" }, update)
update()
