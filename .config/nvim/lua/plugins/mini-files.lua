return {
  {
    "echasnovski/mini.files",
    version = "*",
    config = function()
      require("mini.files").setup({})
      vim.keymap.set("n", "<leader>=", "<CMD>:lua MiniFiles.open()<CR>", { desc = "Open MinFiles" })
    end,
  },
}
