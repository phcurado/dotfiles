vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- File
vim.opt.fileencoding = "utf-8" -- File Encoding

-- Tab
vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true

-- UI
vim.o.winborder = "rounded"
vim.opt.relativenumber = true
vim.wo.number = true
vim.opt.cursorline = true
vim.opt.splitbelow = true
vim.opt.splitright = true
vim.opt.termguicolors = true
vim.opt.diffopt = "internal,filler,closeoff,vertical,linematch:40"
vim.opt.signcolumn = "yes"
vim.opt.scrolloff = 8
vim.opt.sidescrolloff = 8
vim.opt.updatetime = 250
vim.opt.timeoutlen = 300

-- Cases
vim.opt.ignorecase = true
vim.opt.smartcase = true
---

-- Config
vim.opt.clipboard = "unnamedplus"
vim.opt.backspace = "indent,eol,start"
vim.opt.showcmd = true
vim.opt.laststatus = 2
vim.opt.autowrite = true
vim.opt.autoread = true
vim.opt.shiftround = false
-- Persist undo
vim.opt.undofile = true

-- Setting conceallevel for Obsidian
vim.opt.conceallevel = 2

-- blink cursor: https://neovim.io/doc/user/options.html#'guicursor'
-- vim.opt.guicursor =
-- 	"n-v-c:block,i-ci-ve:ver25,r-cr:hor20,o:hor50,a:blinkwait700-blinkoff400-blinkon250-Cursor/lCursor,sm:block-blinkwait175-blinkoff150-blinkon175"
