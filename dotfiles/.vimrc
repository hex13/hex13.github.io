
let g:used_javascript_libs = 'angularjs,underscore,backbone'
execute pathogen#infect()
syntax on
filetype plugin indent on
:set number
:set incsearch
:set hlsearch
:set expandtab
:set tabstop=4
:set shiftwidth=4
:set smartindent
:set ruler
:set cursorline
:set wildmenu
colorscheme darcula
:autocmd FileType javascript inoremap req require('
:autocmd FileType javascript inoremap func function (
:autocmd FileType javascript inoremap iife (function () { })();
:autocmd FileType javascript inoremap conlog console.log();<esc>?(<ENTER>a

:autocmd BufRead,BufNewFile *.kot set filetype=kot
au! Syntax kot source ~/.vim/ftplugin/kot.vim

syntax match Todo /ng-repeat/

nmap <C-x> :set filetype=kot<cr>

" css abbreviations
nnoremap <leader>p 0/:<CR> c$ 
nnoremap <leader>h 0/display:<cr>ccdisplay: none<esc>

let Tlist_Ctags_Cmd='/usr/local/Cellar/ctags/5.8_1/bin/ctags'

