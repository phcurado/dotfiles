local registry = require("core.theme_persistence.registry")

local function try_require(name)
  local ok, mod = pcall(require, name)
  return ok, mod
end

print("🔍 Validating theme registry...\n")

local all_passed = true

for name, meta in pairs(registry) do
  local label = meta.label or name
  local passed = true

  if meta.module then
    local ok = try_require(meta.module)
    if not ok then
      print("❌ Missing module for theme: " .. label .. " (module: " .. meta.module .. ")")
      passed = false
    end
  else
    print("⚠️  No `module` defined for theme: " .. label .. " — skipping require check")
  end

  if type(meta.match) ~= "string" then
    print("❌ Invalid `match` pattern for theme: " .. label)
    passed = false
  end

  if type(meta.setup) ~= "function" then
    print("❌ No setup() function for theme: " .. label)
    passed = false
  end

  if passed then
    print("✅ " .. label .. " — valid")
  else
    all_passed = false
  end
end

if all_passed then
  print("\n🎉 All themes passed validation!")
else
  print("\n🚨 Some themes failed. See above.")
end
