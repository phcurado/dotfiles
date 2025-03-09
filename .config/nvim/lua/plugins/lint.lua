return {
  {
    "mfussenegger/nvim-lint",
    opts = {},
    config = function()
      require("lint").linters_by_ft = {
        markdown = { "markdownlint" },
        elixir = { "credo" },
      }
      vim.api.nvim_create_autocmd({ "BufWritePost" }, {
        callback = function()
          require("lint").try_lint()
        end,
      })
    end,
  },
}
