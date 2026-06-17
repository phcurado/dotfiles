require("core.options")
require("core.autocmds")
require("core.keymaps")
require("core.pi").setup()
require("core.lazy")

-- neovim Package Manager
vim.cmd.packadd("nvim.undotree")
