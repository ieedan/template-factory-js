# template-factory

## 0.3.0

### Minor Changes

- f27fe1c: - overhaul: `templateFiles` have now been ditched in favor of `files` property on
  template
  - fix: `util.relative` now uses decodeURIComponent to properly decode the path name
  - fix: `addDependencies` can now add dependencies to dependency objects that don't yet exist
