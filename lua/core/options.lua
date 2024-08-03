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
vim.opt.relativenumber = true
vim.wo.number = true
vim.opt.cursorline = false -- removing cursor line to make the interface more clean
vim.opt.splitbelow = true
vim.opt.splitright = true
vim.opt.termguicolors = true

-- Config
vim.opt.clipboard = "unnamedplus"
vim.opt.backspace = "indent,eol,start"
vim.opt.showcmd = true
vim.opt.laststatus = 2
vim.opt.autowrite = true
vim.opt.autoread = true
vim.opt.shiftround = false

-- Setting conceallevel for Obsidian
vim.opt_local.conceallevel = 2

-- prevent commenting next line
vim.api.nvim_create_autocmd("FileType", {
	pattern = "*",
	callback = function()
		vim.opt_local.formatoptions:remove({ "r", "o" })
	end,
})
