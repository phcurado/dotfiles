-- Add the sketchybar lua module to the package cpath
package.cpath = package.cpath
  .. ";/Users/" .. os.getenv("USER") .. "/.local/share/sketchybar_lua/?.so"
