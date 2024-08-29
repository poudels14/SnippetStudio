"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const applyFilter = (data, filter) => {
  const paths = filter.split(".");

  const applyFilterRecursive = (current, pathIndex) => {
    if (pathIndex >= paths.length) return current;

    const path = paths[pathIndex];

    if (path === "*" && Array.isArray(current)) {
      return current.map((item) => applyFilterRecursive(item, pathIndex + 1));
    }

    if (path.includes(",")) {
      const fields = path.split(",");
      const result = {};
      fields.forEach((field) => {
        if (current && typeof current === "object" && field in current) {
          result[field] = current[field];
        }
      });
      return Object.keys(result).length > 0 ? result : undefined;
    }

    if (current && typeof current === "object" && path in current) {
      const result = applyFilterRecursive(current[path], pathIndex + 1);
      return result === undefined ? undefined : { [path]: result };
    }

    return undefined;
  };

  return applyFilterRecursive(data, 0);
};

const mergeResults = (results) => {
  const merge = (target, source) => {
    if (Array.isArray(source)) {
      return source.map((item, index) =>
        merge(Array.isArray(target) ? target[index] : undefined, item),
      );
    }
    if (source && typeof source === "object") {
      target = target || {};
      Object.keys(source).forEach((key) => {
        target[key] = merge(target[key], source[key]);
      });
      return target;
    }
    return source;
  };

  return results.reduce((acc, result) => merge(acc, result), {});
};

const JsonFilterApp = () => {
  const [jsonInput, setJsonInput] = useState("");
  const [filtersInput, setFiltersInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const handleJsonChange = (e) => {
    setJsonInput(e.target.value);
    setError("");
  };

  const handleFiltersChange = (e) => {
    setFiltersInput(e.target.value);
    setError("");
  };

  const applyFilters = () => {
    try {
      const data = JSON.parse(jsonInput);
      const filters = filtersInput
        .split("\n")
        .filter((filter) => filter.trim() !== "");
      const filteredResults = filters
        .map((filter) => applyFilter(data, filter))
        .filter((result) => result !== undefined);

      if (filteredResults.length === 0) {
        setResult("No matching results found.");
      } else {
        const mergedResult = mergeResults(filteredResults);
        setResult(JSON.stringify(mergedResult, null, 2));
      }
      setError("");
    } catch (err) {
      setError("Invalid JSON input or filter");
      setResult("");
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        JSON Filter App (Multiline filters, multi-field selection, OR logic,
        preserving structure, array wildcard)
      </h1>
      <div className="mb-4">
        <label className="block mb-2">JSON Input:</label>
        <textarea
          className="w-full h-40 p-2 border rounded"
          value={jsonInput}
          onChange={handleJsonChange}
          placeholder="Enter your JSON here"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">
          Filters (OR logic, use * for array wildcard, one filter per line,
          comma-separated fields):
        </label>
        <textarea
          className="w-full h-32 p-2 border rounded"
          value={filtersInput}
          onChange={handleFiltersChange}
          placeholder="Enter jq-style filters, one per line (e.g. .name&#10;.items.*.id,name&#10;.address.street,city,zipcode)"
        />
      </div>
      <button
        className="px-4 py-2 bg-green-500 text-white rounded mb-4"
        onClick={applyFilters}
      >
        Apply Filters
      </button>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <label className="block mb-2">Result:</label>
        <pre className="w-full h-40 p-2 border rounded bg-gray-100 overflow-auto">
          {result}
        </pre>
      </div>
    </div>
  );
};

export default JsonFilterApp;
