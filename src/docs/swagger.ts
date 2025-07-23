export const openApiDocument = {
	openapi: "3.0.0",
	info: {
		version: "2.0.0",
		title: "Sistema de Processamento de Pedidos API",
		description: `
## 📋 Sobre a API

Esta API fornece funcionalidades para gerenciamento de usuários, autenticação JWT e processamento de pedidos com upload de imagens.
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
			OrderData: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "ID único do pedido",
						example: "order-uuid-123",
					},
					title: {
						type: "string",
						description: "Título do pedido",
						example: "Pedido de Teste",
					},
					description: {
						type: "string",
						description: "Descrição do pedido",
						example: "Descrição detalhada do pedido",
					},
					status: {
						type: "string",
						enum: ["pending", "approved", "rejected", "processing"],
						description: "Status atual do pedido",
						example: "pending",
					},
					imageUrl: {
						type: "string",
						format: "uri",
						description: "URL da imagem do pedido",
						example: "https://res.cloudinary.com/demo/image/upload/v1234567890/orders/abc123.jpg",
					},
					userId: {
						type: "string",
						description: "ID do usuário proprietário do pedido",
						example: "user-uuid-456",
					},
					createdAt: {
						type: "string",
						format: "date-time",
						description: "Data de criação do pedido",
						example: "2025-07-22T10:30:00.000Z",
					},
				},
			},
			UpdateOrderStatusRequest: {
				type: "object",
				required: ["status"],
				properties: {
					status: {
						type: "string",
						enum: ["approved", "rejected", "processing"],
						description: "Novo status para o pedido",
						example: "approved",
					},
					adminName: {
						type: "string",
						description: "Nome do administrador que processou o pedido",
						example: "João Admin",
					},
					reason: {
						type: "string",
						description: "Motivo da decisão (opcional)",
						example: "Pedido atende a todos os requisitos",
					},
				},
			},
			UpdateOrderStatusResponse: {
				type: "object",
				properties: {
					success: {
						type: "boolean",
						description: "Indica se a operação foi bem-sucedida",
						example: true,
					},
					message: {
						type: "string",
						description: "Mensagem descritiva do resultado",
						example: "Order status updated to approved successfully",
					},
					data: {
						type: "object",
						properties: {
							orderId: {
								type: "string",
								description: "ID do pedido atualizado",
								example: "550e8400-e29b-41d4-a716-446655440000",
							},
							status: {
								type: "string",
								description: "Novo status do pedido",
								example: "approved",
							},
							updatedAt: {
								type: "string",
								format: "date-time",
								description: "Data e hora da atualização",
								example: "2025-07-22T10:30:00.000Z",
							},
							processedBy: {
								type: "string",
								description: "Quem processou o pedido",
								example: "João Admin",
							},
						},
					},
				},
			},
			OrderNotFoundErrorResponse: {
				type: "object",
				properties: {
					success: {
						type: "boolean",
						example: false,
					},
					message: {
						type: "string",
						example: "Order not found",
					},
				},
			},
			ForbiddenErrorResponse: {
				type: "object",
				properties: {
					success: {
						type: "boolean",
						example: false,
					},
					message: {
						type: "string",
						example: "Access denied",
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
			get: {
				tags: ["Orders"],
				summary: "Listar pedidos do usuário",
				description: "Lista todos os pedidos do usuário autenticado",
				security: [{ bearerAuth: [] }],
				responses: {
					"200": {
						description: "Lista de pedidos do usuário",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Orders retrieved successfully"
										},
										orders: {
											type: "array",
											items: {
												$ref: "#/components/schemas/OrderData"
											}
										}
									}
								}
							}
						}
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
				},
			},
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
		"/admin/orders/{id}/status": {
			patch: {
				tags: ["Admin"],
				summary: "Atualizar status do pedido",
				description: "Permite que administradores atualizem o status de um pedido (aprovar, rejeitar ou processar)",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						description: "ID único do pedido",
						schema: {
							type: "string",
							format: "uuid",
							example: "550e8400-e29b-41d4-a716-446655440000"
						}
					}
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/UpdateOrderStatusRequest"
							}
						}
					}
				},
				responses: {
					"200": {
						description: "Status do pedido atualizado com sucesso",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UpdateOrderStatusResponse"
								}
							}
						}
					},
					"400": {
						description: "Dados inválidos",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ValidationErrorResponse"
								}
							}
						}
					},
					"401": {
						description: "Token não fornecido ou inválido",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UnauthorizedErrorResponse"
								}
							}
						}
					},
					"403": {
						description: "Acesso negado - apenas administradores",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ForbiddenErrorResponse"
								}
							}
						}
					},
					"404": {
						description: "Pedido não encontrado ou não pode ser atualizado",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/OrderNotFoundErrorResponse"
								}
							}
						}
					}
				}
			}
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
		{
			name: "Admin",
			description: "Operações administrativas - requerem permissões de administrador",
		},
	],
};
