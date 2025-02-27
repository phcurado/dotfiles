return {
  {
    "stevearc/oil.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    config = function()
      require("oil").setup({
        default_file_explorer = true,
        skip_confirm_for_simple_edits = true,
        columns = {
          { "icon", add_padding = false },
        },
        float = {
          max_width = 0.85,
          max_height = 0.85,
        },
        view_options = {
          -- Show files and directories that start with "."
          show_hidden = true,
        },
        keymaps = {
          ["q"] = { "actions.close", mode = "n" },
        },
      })

      vim.keymap.set("n", "-", "<CMD>Oil --float<CR>", { desc = "Open parent directory" })
    end,
  },
}
