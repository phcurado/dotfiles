return {
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter.configs").setup({
        ensure_installed = {
          "lua",
          "elixir",
          "heex",
          "json",
          "javascript",
          "typescript",
          "html",
          "css",
          "markdown",
          "markdown_inline",
          "bash",
          "dockerfile",
          "gitignore",
          "regex",
          "gdscript",
          "godot_resource",
          "gdshader",
          "terraform",
          "tsx",
          "python",
          "toml",
          "yaml",
        },
        ignore_install = {},
        sync_install = false,
        auto_install = true,

        highlight = {
          enable = true,
          -- disable treesitter for large files
          disable = function(_, bufnr) --
            return vim.api.nvim_buf_line_count(bufnr) > 50000
          end,
          additional_vim_regex_highlighting = false,
        },
        indent = { enable = true },
      })
    end,
  },
}
