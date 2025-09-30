return {
  "A7Lavinraj/fyler.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  opts = { icon_provider = "nvim_web_devicons" },
  config = function(_, opts)
    local fyler = require("fyler").setup(opts)
    vim.keymap.set("n", "<leader>n", ":Fyler kind=split_left<CR>", { desc = "Toggle File Explorer" })
  end,
}
