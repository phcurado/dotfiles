return {
  "obsidian-nvim/obsidian.nvim",
  version = "*",
  ft = "markdown",
  opts = {
    legacy_commands = false,
    ui = { enable = false },
    workspaces = {
      {
        name = "phcurado",
        path = "~/Documents/phcurado/obsidian",
      },
    },
  },
}
