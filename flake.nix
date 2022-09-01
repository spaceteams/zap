{
  description = "schema-ts";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-21.11";
  inputs.master.url = "github:NixOS/nixpkgs/master";

  inputs.utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, master, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        unstable = import master { inherit system; };
      in
      {
        devShell = pkgs.mkShell {
          name = "frontend";
          packages = with pkgs; [ findutils cmake pre-commit unstable.nodejs ];
          postShellHook = ''
            ${pkgs.pre-commit}/bin/pre-commit install
            export PATH="$PWD/node_modules/.bin/:$PATH"
          '';
        };
      });
}

