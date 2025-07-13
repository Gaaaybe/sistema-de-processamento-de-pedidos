// Configuração manual do OpenAPI/Swagger
export const openApiDocument = {
	openapi: "3.0.0",
	info: {
		version: "2.0.0",
		title: "Sistema de Processamento de Pedidos API",
		description: `
## 📋 Sobre a API

Esta API fornece funcionalidades para gerenciamento de usuários, autenticação JWT e processamento de pedidos com upload de imagens.

### 🔐 Autenticação
- Use o endpoint \`/users/authenticate\` para obter um token JWT
- Inclua o token no header: \`Authorization: Bearer <seu-token>\`
- Tokens têm validade limitada por segurança

### 👥 Tipos de Usuário
- **user**: Usuário padrão com acesso a criação de pedidos
- **admin**: Administrador com acesso total

### 📦 Sistema de Pedidos
- Usuários podem criar pedidos com upload de imagem obrigatório
- Apenas um pedido pendente por usuário é permitido
- Formatos suportados: PNG, JPEG, JPG
- Tamanho máximo: 5MB por arquivo

### 📝 Formatos de Data
- Todas as datas seguem o padrão ISO 8601 (UTC)
- Exemplo: \`2025-07-07T10:30:00.000Z\`

### ⚠️ Rate Limiting
- Limite de 100 requisições por minuto por IP
- Headers de rate limit inclusos nas respostas

### 🛡️ Segurança
- Senhas devem ter pelo menos 6 caracteres
- Senhas devem conter: maiúscula, minúscula e número
- Dados sensíveis nunca são retornados nas respostas
- Upload de arquivos com validação de tipo e tamanho
    `,
		contact: {
			name: "Equipe de Desenvolvimento",
			email: "dev@exemplo.com",
			url: "https://github.com/seu-usuario/sistema-pedidos",
		},
		license: {
			name: "ISC",
			url: "https://opensource.org/licenses/ISC",
		},
		termsOfService: "https://seudominio.com/termos",
	},
	servers: [
		{
			url: "http://localhost:3001",
			description: "Servidor de desenvolvimento",
		},
		{
			url: "https://api.seudominio.com",
			description: "Servidor de produção",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
				description: "Token JWT obtido via /users/authenticate",
			},
		},
		schemas: {
			RegisterRequest: {
				type: "object",
				required: ["name", "email", "password"],
				properties: {
					name: {
						type: "string",
						minLength: 1,
						description: "Nome completo do usuário",
						example: "João Silva",
					},
					email: {
						type: "string",
						format: "email",
						description: "Email válido do usuário",
						example: "joao@exemplo.com",
					},
					password: {
						type: "string",
						minLength: 6,
						description:
							"Senha forte com pelo menos 6 caracteres, contendo maiúscula, minúscula e número",
						example: "MinhaSenh@123",
						pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
					},
					role: {
						type: "string",
						enum: ["admin", "user"],
						default: "user",
						description: "Papel do usuário no sistema",
					},
				},
				additionalProperties: false,
			},
			RegisterResponse: {
				type: "object",
				required: ["message"],
				properties: {
					message: {
						type: "string",
						description: "Mensagem de confirmação",
						example: "User registered successfully",
					},
				},
			},
			AuthenticateRequest: {
				type: "object",
				required: ["email", "password"],
				properties: {
					email: {
						type: "string",
						format: "email",
						description: "Email do usuário cadastrado",
						example: "joao@exemplo.com",
					},
					password: {
						type: "string",
						minLength: 1,
						description: "Senha do usuário",
						example: "MinhaSenh@123",
					},
				},
				additionalProperties: false,
			},
			AuthenticateResponse: {
				type: "object",
				required: ["token", "user"],
				properties: {
					token: {
						type: "string",
						description: "Token JWT para autenticação",
						example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
					},
					user: {
						$ref: "#/components/schemas/UserData",
					},
				},
			},
			UserData: {
				type: "object",
				required: ["id", "name", "email", "role", "createdAt"],
				properties: {
					id: {
						type: "string",
						format: "uuid",
						description: "ID único do usuário",
						example: "550e8400-e29b-41d4-a716-446655440000",
					},
					name: {
						type: "string",
						description: "Nome do usuário",
						example: "João Silva",
					},
					email: {
						type: "string",
						format: "email",
						description: "Email do usuário",
						example: "joao@exemplo.com",
					},
					role: {
						type: "string",
						enum: ["admin", "user"],
						description: "Papel do usuário",
						example: "user",
					},
					createdAt: {
						type: "string",
						format: "date-time",
						description: "Data e hora de criação do usuário",
						example: "2025-07-07T10:30:00.000Z",
					},
				},
			},
			ValidationErrorResponse: {
				type: "object",
				required: ["message"],
				properties: {
					message: {
						type: "string",
						description: "Mensagem de erro de validação",
						example: "Validation failed",
					},
					errors: {
						type: "array",
						description: "Lista de erros de validação",
						example: [
							{
								field: "email",
								message: "Invalid email format",
							},
							{
								field: "password",
								message: "Password must contain at least one uppercase letter",
							},
						],
						items: {
							type: "object",
							properties: {
								field: {
									type: "string",
									description: "Campo que falhou na validação",
									example: "email",
								},
								message: {
									type: "string",
									description: "Mensagem de erro específica",
									example: "Invalid email format",
								},
							},
						},
					},
				},
			},
			UserExistsErrorResponse: {
				type: "object",
				required: ["message"],
				properties: {
					message: {
						type: "string",
						description: "Mensagem de erro quando usuário já existe",
						example: "User already exists",
					},
				},
			},
			InvalidCredentialsErrorResponse: {
				type: "object",
				required: ["message"],
				properties: {
					message: {
						type: "string",
						description: "Mensagem de erro para credenciais inválidas",
						example: "Invalid credentials",
					},
				},
			},
			UnauthorizedErrorResponse: {
				type: "object",
				required: ["message"],
				properties: {
					message: {
						type: "string",
						description: "Mensagem de erro para acesso não autorizado",
						example: "Unauthorized access",
					},
				},
			},
			UsersListResponse: {
				type: "array",
				description: "Lista de usuários do sistema",
				example: [
					{
						id: "550e8400-e29b-41d4-a716-446655440000",
						name: "João Silva",
						email: "joao@exemplo.com",
						role: "user",
						createdAt: "2025-07-07T10:30:00.000Z",
					},
					{
						id: "550e8400-e29b-41d4-a716-446655440001",
						name: "Admin User",
						email: "admin@exemplo.com",
						role: "admin",
						createdAt: "2025-07-06T15:45:00.000Z",
					},
				],
				items: {
					$ref: "#/components/schemas/UserData",
				},
			},
			// Orders Schemas
			EmitOrderRequest: {
				type: "object",
				required: ["title", "description", "image"],
				properties: {
					title: {
						type: "string",
						minLength: 1,
						maxLength: 255,
						description: "Título do pedido",
						example: "Pedido de Comprovante de Matrícula",
					},
					description: {
						type: "string",
						minLength: 1,
						maxLength: 1000,
						description: "Descrição detalhada do pedido",
						example: "Solicito comprovante de matrícula atualizado para o semestre 2025.1",
					},
					image: {
						type: "string",
						format: "binary",
						description: "Imagem anexa ao pedido (PNG, JPEG, JPG - máx 5MB)",
					},
				},
				additionalProperties: false,
			},
			EmitOrderResponse: {
				type: "object",
				required: ["id", "title", "description", "imageUrl", "status", "createdAt"],
				properties: {
					id: {
						type: "string",
						format: "uuid",
						description: "ID único do pedido",
						example: "550e8400-e29b-41d4-a716-446655440000",
					},
					title: {
						type: "string",
						description: "Título do pedido",
						example: "Pedido de Comprovante de Matrícula",
					},
					description: {
						type: "string",
						description: "Descrição do pedido",
						example: "Solicito comprovante de matrícula atualizado para o semestre 2025.1",
					},
					imageUrl: {
						type: "string",
						format: "uri",
						description: "URL da imagem uploadada",
						example: "https://res.cloudinary.com/demo/image/upload/v1234567890/orders/abc123.jpg",
					},
					status: {
						type: "string",
						enum: ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"],
						description: "Status atual do pedido",
						example: "PENDING",
					},
					createdAt: {
						type: "string",
						format: "date-time",
						description: "Data de criação do pedido",
						example: "2025-07-12T10:30:00.000Z",
					},
				},
			},
			OrderExistsErrorResponse: {
				type: "object",
				required: ["message", "timestamp", "path", "method", "statusCode"],
				properties: {
					message: {
						type: "string",
						description: "Mensagem de erro quando usuário já tem pedido pendente",
						example: "User already has a pending order",
					},
					timestamp: {
						type: "string",
						format: "date-time",
						description: "Timestamp do erro",
						example: "2025-07-12T10:30:00.000Z",
					},
					path: {
						type: "string",
						description: "Path da requisição",
						example: "/orders",
					},
					method: {
						type: "string",
						description: "Método HTTP",
						example: "POST",
					},
					statusCode: {
						type: "integer",
						description: "Código de status HTTP",
						example: 409,
					},
				},
			},
			FileValidationErrorResponse: {
				type: "object",
				required: ["message", "timestamp", "path", "method", "statusCode"],
				properties: {
					message: {
						type: "string",
						description: "Mensagem de erro de validação de arquivo",
						example: "Image is required",
					},
					timestamp: {
						type: "string",
						format: "date-time",
						description: "Timestamp do erro",
						example: "2025-07-12T10:30:00.000Z",
					},
					path: {
						type: "string",
						description: "Path da requisição",
						example: "/orders",
					},
					method: {
						type: "string",
						description: "Método HTTP",
						example: "POST",
					},
					statusCode: {
						type: "integer",
						description: "Código de status HTTP",
						example: 400,
					},
				},
			},
		},
	},
	paths: {
		"/users": {
			post: {
				tags: ["Users"],
				summary: "Registrar novo usuário",
				description: "Cria uma nova conta de usuário no sistema",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/RegisterRequest",
							},
						},
					},
				},
				responses: {
					"201": {
						description: "Usuário criado com sucesso",
						headers: {
							Location: {
								description: "URL do recurso criado",
								schema: {
									type: "string",
									example: "/users/550e8400-e29b-41d4-a716-446655440000",
								},
							},
						},
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/RegisterResponse",
								},
							},
						},
					},
					"400": {
						description: "Dados inválidos",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ValidationErrorResponse",
								},
							},
						},
					},
					"409": {
						description: "Usuário já existe",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UserExistsErrorResponse",
								},
							},
						},
					},
				},
			},
			get: {
				tags: ["Users"],
				summary: "Listar usuários (Admin)",
				description:
					"Lista todos os usuários do sistema. Requer permissão de administrador.",
				security: [{ bearerAuth: [] }],
				responses: {
					"200": {
						description: "Lista de usuários",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UsersListResponse",
								},
							},
						},
					},
					"401": {
						description: "Token não fornecido ou inválido",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UnauthorizedErrorResponse",
								},
							},
						},
					},
					"403": {
						description: "Acesso negado - apenas administradores",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UnauthorizedErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/users/authenticate": {
			post: {
				tags: ["Authentication"],
				summary: "Autenticar usuário",
				description: "Autentica um usuário e retorna um token JWT",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/AuthenticateRequest",
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Autenticação realizada com sucesso",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/AuthenticateResponse",
								},
							},
						},
					},
					"400": {
						description: "Dados inválidos",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ValidationErrorResponse",
								},
							},
						},
					},
					"401": {
						description: "Credenciais inválidas",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/InvalidCredentialsErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/orders": {
			post: {
				tags: ["Orders"],
				summary: "Criar novo pedido",
				description: "Cria um novo pedido com upload de imagem. Usuário deve estar autenticado e não pode ter pedidos pendentes.",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"multipart/form-data": {
							schema: {
								$ref: "#/components/schemas/EmitOrderRequest",
							},
						},
					},
				},
				responses: {
					"201": {
						description: "Pedido criado com sucesso",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/EmitOrderResponse",
								},
							},
						},
					},
					"400": {
						description: "Dados inválidos ou imagem não fornecida",
						content: {
							"application/json": {
								schema: {
									anyOf: [
										{ $ref: "#/components/schemas/ValidationErrorResponse" },
										{ $ref: "#/components/schemas/FileValidationErrorResponse" }
									],
								},
							},
						},
					},
					"401": {
						description: "Token não fornecido ou inválido",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UnauthorizedErrorResponse",
								},
							},
						},
					},
					"409": {
						description: "Usuário já possui um pedido pendente",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/OrderExistsErrorResponse",
								},
							},
						},
					},
					"413": {
						description: "Arquivo muito grande (máximo 5MB)",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/FileValidationErrorResponse",
								},
							},
						},
					},
					"415": {
						description: "Formato de arquivo não suportado",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/FileValidationErrorResponse",
								},
							},
						},
					},
				},
			},
		},
	},
	tags: [
		{
			name: "Users",
			description: "Operações relacionadas a usuários",
		},
		{
			name: "Authentication",
			description: "Operações de autenticação e autorização",
		},
		{
			name: "Orders",
			description: "Operações relacionadas a pedidos e upload de documentos",
		},
	],
};
