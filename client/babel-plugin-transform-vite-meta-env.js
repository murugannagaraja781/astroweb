// Custom Babel plugin to transform import.meta.env to process.env for Jest
export default function () {
    return {
        name: "transform-import-meta-env",
        visitor: {
            // Transform typeof import.meta to typeof process
            UnaryExpression(path) {
                if (
                    path.node.operator === "typeof" &&
                    path.node.argument.type === "MetaProperty" &&
                    path.node.argument.meta.name === "import" &&
                    path.node.argument.property.name === "meta"
                ) {
                    path.replaceWithSourceString("typeof process");
                }
            },
            // Transform import.meta.env to process.env
            MemberExpression(path) {
                // Transform import.meta.env.VITE_API_URL to process.env.VITE_API_URL
                if (
                    path.node.object.type === "MetaProperty" &&
                    path.node.object.meta.name === "import" &&
                    path.node.object.property.name === "meta" &&
                    path.node.property.name === "env"
                ) {
                    path.replaceWithSourceString("process.env");
                }
            },
        },
    };
}
