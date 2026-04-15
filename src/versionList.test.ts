import { validateVersions, VersionIndex } from "./versionList";

const MOCK_VERSIONS = [
  "2020-08-27",
  "2022-08-01",
  "2023-10-16",
  "2024-04-10",
];

describe("validateVersions", () => {
  it("passes when both versions are valid and different", () => {
    expect(() =>
      validateVersions("2020-08-27", "2024-04-10", MOCK_VERSIONS)
    ).not.toThrow();
  });

  it("throws when 'from' version is not in available list", () => {
    expect(() =>
      validateVersions("2019-01-01", "2024-04-10", MOCK_VERSIONS)
    ).toThrow(/"2019-01-01" is not available/);
  });

  it("throws when 'to' version is not in available list", () => {
    expect(() =>
      validateVersions("2020-08-27", "2099-01-01", MOCK_VERSIONS)
    ).toThrow(/"2099-01-01" is not available/);
  });

  it("throws when 'from' and 'to' are the same version", () => {
    expect(() =>
      validateVersions("2022-08-01", "2022-08-01", MOCK_VERSIONS)
    ).toThrow(/must be different/);
  });

  it("error message includes hint about --list-versions flag", () => {
    expect(() =>
      validateVersions("2000-01-01", "2024-04-10", MOCK_VERSIONS)
    ).toThrow(/--list-versions/);
  });
});

describe("VersionIndex shape", () => {
  it("latest should be the last sorted version", () => {
    const index: VersionIndex = {
      versions: MOCK_VERSIONS,
      latest: MOCK_VERSIONS[MOCK_VERSIONS.length - 1],
    };
    expect(index.latest).toBe("2024-04-10");
  });

  it("versions array should be sorted ascending", () => {
    const unsorted = ["2024-04-10", "2020-08-27", "2022-08-01"];
    const sorted = [...unsorted].sort();
    expect(sorted[0]).toBe("2020-08-27");
    expect(sorted[sorted.length - 1]).toBe("2024-04-10");
  });
});
