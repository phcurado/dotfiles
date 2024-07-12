local cmp = require("cmp")
cmp.setup({
  -- add different completion source
  sources = cmp.config.sources({
    { name = "nvim_lsp" },
    { name = "buffer" },
    { name = "path" },
  }),
  -- using default mapping preset
  mapping = cmp.mapping.preset.insert({
    ["<C-Space>"] = cmp.mapping.complete(),
    ["<CR>"] = cmp.mapping.confirm({ select = true }),
  }),
  snippet = {
    -- you must specify a snippet engine
    expand = function(args)
      -- using neovim v0.10 native snippet feature
      -- you can also use other snippet engines
      vim.snippet.expand(args.body)
    end,
  },
})
