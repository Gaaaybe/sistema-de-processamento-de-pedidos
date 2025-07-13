import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	test: {
		pool: "threads",
		poolOptions: {
			threads: {
				singleThread: true,
			},
		},
		testTimeout: 30000,
	},
});
