-- Left / center
require("items.apple")
require("items.spaces")
require("items.spotify")

-- Right side (added rightmost-first): clock, then the status controls, then cpu
require("items.calendar")
require("items.battery")
require("items.volume")
require("items.brightness")
require("items.bluetooth")
require("items.wifi")
require("items.cpu")

-- Status fieldset bracket (must come after all its members exist)
require("items.status")
