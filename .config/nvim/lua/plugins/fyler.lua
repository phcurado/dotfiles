return {
  "A7Lavinraj/fyler.nvim",
  dependencies = { "nvim-mini/mini.icons" },
  branch = "stable",
  opts = {},
  config = function()
    require("fyler").setup()
    vim.keymap.set("n", "<leader>n", ":Fyler kind=split_left_most<CR>", { desc = "Toggle File Explorer" })
  end,
}
