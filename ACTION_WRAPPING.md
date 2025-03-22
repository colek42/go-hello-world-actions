# Action Wrapping with Witness-Run-Action

This document explains different approaches to wrapping GitHub Actions with the `witness-run-action` for creating attestations.

## Approaches to Action Wrapping

There are two main approaches to wrapping actions with witness-run-action:

1. **Command Wrapping (Recommended)**: Using witness-run-action with the `command` parameter to run a CLI command directly
2. **Action Wrapping**: Using witness-run-action with the `action-ref` parameter to wrap another GitHub Action

## Command Wrapping (Recommended)

The command wrapping approach is more reliable and simpler to implement. This approach:

- Installs the required tools directly (e.g., using `go install` for GoReleaser)
- Uses witness-run-action's `command` parameter to execute the tool

### Example: GoReleaser Command Wrapping

```yaml
- name: Install GoReleaser
  run: go install github.com/goreleaser/goreleaser@latest

- name: GoReleaser with Witness
  uses: testifysec/witness-run-action@feature/action-wrapping
  with:
    step: "goreleaser"
    command: "goreleaser release --snapshot --clean"
    enable-sigstore: true
    enable-archivista: true
    attestations: "environment github slsa"
```

## Action Wrapping (With Limitations)

The action wrapping approach uses witness-run-action's `action-ref` parameter to wrap another GitHub Action.

### Known Issues with Action Wrapping

1. **Boolean Parameter Handling**: There are challenges with passing boolean parameters to wrapped actions:
   - YAML 1.2 "Core Schema" specification requires booleans to be one of: `true | True | TRUE | false | False | FALSE`
   - The goreleaser action expects string representations of booleans

2. **Input Prefix Handling**: When using the `input-` prefix for parameters:
   - Input parameters for the wrapped action need to be prefixed with `input-`
   - This adds complexity and potential for errors

### Example: GoReleaser Action Wrapping

```yaml
- name: GoReleaser with Witness
  uses: testifysec/witness-run-action@feature/action-wrapping
  with:
    step: "goreleaser"
    action-ref: "goreleaser/goreleaser-action@v5"
    # Inputs for goreleaser action
    input-version: latest
    input-args: "release --snapshot --clean"
    input-install-only: "false"  # String format - still has issues
    enable-sigstore: true
    enable-archivista: true
    attestations: "environment github slsa"
```

## Recommendations

1. **Prefer Command Wrapping**: Use the command wrapping approach when possible
2. **Use String Format for Booleans**: If you must use action wrapping, use quoted string values for boolean parameters (`"true"` and `"false"`) to increase compatibility
3. **Test Thoroughly**: Different actions may have different requirements and behaviors

## Future Improvements

The witness-run-action team is working on improving action wrapping to better handle:
- Boolean parameter handling
- Input parameter prefixing
- Better error messages

Stay tuned for updates!